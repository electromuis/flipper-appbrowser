from octokit import Octokit
import urllib, logging, sys, json, base64, re, os, time

log = logging.getLogger(__name__)

git_token = os.getenv('GIT_TOKEN')

if git_token:
    git_client = Octokit(auth='token', token=git_token)
else:
    git_client = Octokit()

def find_apps():
    ret = []
    page = 1

    while True:
        search_response = git_client.search.code(
            page=page,
            per_page=100,
            q="filename:\"application.fam\" path:/"
        )
        page = page + 1

        found = search_response.json
        logging.debug(found)

        if 'items' not in found or len(found['items']) == 0:
            break
        
        for v in found['items']:
            ret.append(v)
        
        time.sleep(61)

    return ret

def read_app_file(app, file):
    url = 'https://raw.githubusercontent.com/{}/{}/{}'.format(
        app.repo_json['full_name'],
        app.repo_json['default_branch'],
        file
    )
    data = urllib.request.urlopen(url).read().decode('utf-8')
    return data

def read_app_fam(app):
    try:
        data = read_app_file(app, 'application.fam')

        m = re.findall("([\w_]+)=([^,]+),?\)?$", data, re.MULTILINE)
        meta = {}
        for k, v in m:
            meta[k] = v.strip('"')

        log.debug(meta)
        return meta
    except:
        return {}

def read_repo_info(app):
    data = git_client.repos.get(
        owner=app.search_json['repository']['owner']['login'],
        repo=app.search_json['repository']['name']
    ).json
    
    log.debug(data)
    return data

def read_readme(app):
    try:
        return read_app_file(app, 'README.md')
    except:
        try:
            return read_app_file(app, 'README')
        except:
            return None

def get_repo_files(app):
    data = git_client.git.get_tree(
        owner=app.author,
        repo=app.title,
        tree_sha=app.last_commit,
        recursive=True
    )

    return data.json
    

def get_last_commit(app):
    data = git_client.repos.list_commits(
        owner=app.author,
        repo=app.title
    ).json

    if len(data) > 0:
        return data[0]['sha']
    else:
        return None
