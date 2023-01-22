from flask import Flask, json, request, jsonify, send_file
from octokit import Octokit
import os, tempfile, glob, json

git_token = '***'
ufbt = "/workspace/flipper-appbrowser/flipperzero-ufbt/ufbt"
api = Flask(
    __name__,
    static_url_path='', 
    static_folder='dist',
    port=os.getenv('PORT', 80)
)

@api.route('/apps.json', methods=['GET'])
def search_apps():
    if os.path.exists("apps.json"):
        return send_file("apps.json")

    git_client = Octokit(auth='token', token=git_token)
    page = 0
    more = True
    repos = []
    while more:
        result = git_client.search.code(
            per_page=100,
            page=page,
            q="filename:\"application.fam\" path:/"
        )
        if len(result.response.items) < 100:
            more = False
        for i in result.response.items:
            repos.append({
                'id': i.repository.id,
                'repo': i.repository.name,
                'user': i.repository.owner.login,
                'avatar': i.repository.owner.avatar_url,
                'description': i.repository.description
            }) 

    json_object = json.dumps(repos, indent=4)
    with open("apps.json", "w") as outfile:
        outfile.write(json_object)

    return jsonify(repos), 200

@api.route('/build/<git_user>/<git_repo>', methods=['GET'])
def build_app(git_user, git_repo):
    # Cloning the repo
    url = "https://github.com/{}/{}".format(git_user, git_repo)
    with tempfile.TemporaryDirectory() as tmpdirname:
        os.system("git clone {} {}".format(url, tmpdirname))
        os.chdir(tmpdirname)

        # Build the app 
        os.system(ufbt)
        files = glob.glob("./dist/*.fap")
        if len(files) != 1:
            return jsonify(["building fap failed"]), 400
        
        return send_file(tmpdirname + "/" + files[0])

if __name__ == '__main__':
    api.run()