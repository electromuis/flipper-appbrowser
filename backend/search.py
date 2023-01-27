import logging

from sqlalchemy.sql import func
from db import SearchRequest, mydb, App
from github import git_client

log = logging.getLogger(__name__)

def search_task():
    page = 1
    last_request = mydb.session.query(SearchRequest).order_by(SearchRequest.created_at.desc()).first()

    if last_request and len(last_request.get_items()) > 0:
        page = last_request.page + 1

    query = "filename:\"application.fam\" \"App(\" in:file"
    next_request = SearchRequest(
        page = page,
        query = query,
        created_at = func.now()
    )
    mydb.session.add(next_request)
    mydb.session.commit()
    
    search_response = git_client.search.code(
        page=page,
        q=query
    )
    next_request.response = search_response.json
    next_request.response_total = next_request.get_response_total()
    next_request.num_items = len(next_request.get_items())

    mydb.session.commit()

    return next_request
    
def save_apps(search_response):
    new = 0
    items = search_response.get_items()
    for a in items:
        row = App.query.filter_by(title=a['repository']['name'], author=a['repository']['owner']['login']).first()
        if not row:
            row = App(
                title=a['repository']['name'],
                author=a['repository']['owner']['login']
            )
            mydb.session.add(row)
            new = new + 1
        row.search_json = a
        mydb.session.commit()
        row.update_hide()
        mydb.session.commit()

    log.debug("Found {}, new {}".format(len(items), new))

    return len(items), new
