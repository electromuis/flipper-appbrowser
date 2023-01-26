from subprocess import check_output
import os, tempfile, glob, logging
from flask import send_file

from db import mydb, BuildTask

log = logging.getLogger(__name__)
ufbt = "/opt/ufbt/ufbt"

def do_build_app(app=None, title=None, author=None):
    if app:
        title = app.title
        author = app.author
    
    build_row = BuildTask(
        app_title = title,
        app_author = author
    )

    url = "https://github.com/{}/{}".format(author, title)
    os.chdir('/')
    with tempfile.TemporaryDirectory() as tmpdirname:
        log.debug(tmpdirname)
        
        os.system("git clone {} {}".format(url, tmpdirname))
        
        build_row.git_hash = check_output(['git', 'rev-parse', 'HEAD'], cwd=tmpdirname).decode('UTF-8')
        mydb.session.add(build_row)
        mydb.session.commit()


        # Build the app
        output = check_output([ufbt], cwd=tmpdirname).decode('UTF-8')
        build_row.output = output

        files = glob.glob(tmpdirname + "/dist/*.fap")
        if len(files) != 1:
            build_row.success = False
            mydb.session.commit()

            raise Exception("Building fap failed")

        build_row.success = True
        mydb.session.commit()
        
        if app:
            app.downloads = app.downloads + 1
            mydb.session.commit()

        return send_file(files[0])