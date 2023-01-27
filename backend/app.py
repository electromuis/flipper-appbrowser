from flask import Flask, json, request, jsonify, send_file, redirect
import os, tempfile, glob, json, sys, logging
import sqlalchemy_searchable

logging.basicConfig(level=logging.DEBUG)

from datetime import datetime, timedelta
from db import App, init_app_db, mydb
from search import search_task, save_apps
from build import do_build_app

api = Flask(
    'flipper-apps',
    static_url_path='', 
    static_folder='./../frontend/dist'
)

api.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DB_URL')

@api.route('/', methods=['GET'])
def hello():
    return redirect("index.html", code=302)

@api.route('/apps.json', methods=['GET'])
def apps_get():
    args = request.args

    query = mydb.session.query(App).filter_by(hide = False)

    searchQuery = args.get('query')
    if searchQuery:
        query = sqlalchemy_searchable.search(query, searchQuery)
    
    sortBy = args.get('sort_by', 'title')
    if sortBy == 'title':
      query = query.order_by(App.title.asc())
    elif sortBy == 'author':
      query = query.order_by(App.author.asc())
    elif sortBy == 'downloads':
        query = query.order_by(App.downloads.desc())
    elif sortBy == 'stars':
        query = query.order_by(App.stars.desc())

    # if bool(args.get('sort_dir', False)):
    #     searchCol = getattr(App, sortBy).asc()
    # else:
    #     searchCol = getattr(App, sortBy).desc()
    
    # query = query.order_by(searchCol)

    apps = mydb.paginate(query,
        page = int(args.get('page', 1)),
        per_page = int(args.get('per_page', 5))
    )

    for a in apps:
        if not a.updated_at or (datetime.today() - a.updated_at).days > 1:
            a.update_data()

    mydb.session.commit()
    
    return jsonify({
        'items': list(map(lambda a: a.get_meta(), apps)),
        'total': apps.total
    })

@api.route('/apps/index', methods=['GET'])
def apps_index():
    search_response = search_task()
    found, new = save_apps(search_response)
    
    return "Found {}, new {}".format(found, new), 200

@api.route('/apps/update', methods=['GET'])
def apps_update():
    apps = App.query.all()
    for a in apps:
        a.update_data()

    mydb.session.commit()
    return str(len(apps)), 200


@api.route('/build/<git_user>/<git_repo>', methods=['GET'])
def build_app(git_user, git_repo):
    app = App.query.filter_by(title=git_repo, author=git_user).first()

    try:
        if app:
            return do_build_app(app=app)
        else:
            return do_build_app(title=git_repo, author=git_user)
    except:
        return redirect("/index.html?message=Build failed", code=302)

init_app_db(api)

if __name__ == '__main__':
    api.run(port=os.getenv('PORT', 80), host='0.0.0.0', debug=True)