from subprocess import Popen, PIPE
import os, tempfile, glob, logging
from flask import send_file

from db import mydb, BuildTask

log = logging.getLogger(__name__)
ufbt = "/opt/ufbt/ufbt"

def build_app(app=None, title=None, author=None):
    if app:
        title = app.title
    
    build_row = BuildTask(
        app_title = title,
        app_author = author
    )

    url = "https://github.com/{}/{}".format(author, title)
    os.chdir('/')
    with tempfile.TemporaryDirectory() as tmpdirname:
        log.debug(tmpdirname)
        
        os.system("git clone {} {}".format(url, tmpdirname))
        os.chdir(tmpdirname)

        subprocess = subprocess.Popen("git rev-parse HEAD", shell=True, stdout=subprocess.PIPE)
        build_row.git_hash = subprocess.stdout.read()
        mydb.session.add(build_row)
        mydb.session.commit()


        # Build the app
        subprocess = subprocess.Popen(ufbt, shell=True, stdout=subprocess.PIPE)
        build_row.output = subprocess.stdout.read()

        files = glob.glob("./dist/*.fap")
        if len(files) != 1:
            build_row.success = False
            mydb.session.commit()

            raise Exception("Building fap failed")

        build_row.success = True
        mydb.session.commit()
        
        if app:
            app.downloads = app.downloads + 1
            mydb.session.commit()

        return send_file(tmpdirname + "/" + files[0])