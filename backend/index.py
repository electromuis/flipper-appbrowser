from flask import Flask, json, request, jsonify, send_file, redirect
import os, tempfile, glob, json, sys, logging

logging.basicConfig(level=logging.DEBUG)

from datetime import datetime, timedelta
from sqlalchemy.sql import func
from db import App, init_app_db, get_or_create, mydb
from github import find_apps, read_app_fam, read_repo_info, read_readme

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
    
    apps = App.query.order_by(args.get('sort_by', 'title')).paginate(
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
    apps = find_apps()

    for a in apps:
        row = App.query.filter_by(title=a['repository']['name'], author=a['repository']['owner']['login']).first()
        if not row:
            row = App(
                title=a['repository']['name'],
                author=a['repository']['owner']['login']
            )
            mydb.session.add(row)
        row.search_json = a
        mydb.session.commit()
    
    
    return str(len(apps)), 200

@api.route('/apps/update', methods=['GET'])
def apps_update():
    apps = session.query(App).all()
    for a in apps:
        a.update_data()

    mydb.session.commit()
    return str(len(apps)), 200

ufbt = "/opt/ufbt/ufbt"
@api.route('/build/<git_user>/<git_repo>', methods=['GET'])
def build_app(git_user, git_repo):
    app = App.query.filter_by(title=git_repo, author=git_user).first()
    if not app:
        raise "App not found"

    # Cloning the repo
    url = "https://github.com/{}/{}".format(git_user, git_repo)
    with tempfile.TemporaryDirectory() as tmpdirname:
        api.logger.debug(tmpdirname)
        os.system("git clone {} {}".format(url, tmpdirname))
        os.chdir(tmpdirname)

        # Build the app 
        os.system(ufbt)
        files = glob.glob("./dist/*.fap")
        if len(files) != 1:
            return jsonify(["building fap failed"]), 400
        
        app.downloads = app.downloads + 1
        mydb.session.commit()

        return send_file(tmpdirname + "/" + files[0])

if __name__ == '__main__':
    init_app_db(api)
    api.run(port=os.getenv('PORT', 80), host='0.0.0.0', debug=True)