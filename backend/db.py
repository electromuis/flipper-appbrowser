import os, logging

import sqlalchemy
from sqlalchemy import create_engine, Column, String, Integer, ForeignKey, MetaData, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.sql import func

from sqlalchemy_searchable import make_searchable
from sqlalchemy_utils.types import TSVectorType

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from github import read_app_fam, read_repo_info, read_readme, get_last_commit

log = logging.getLogger(__name__)

mydb = SQLAlchemy()
make_searchable(mydb.Model.metadata)

class BuildTask(mydb.Model):
    __tablename__ = 'build_tasks'

    ID=Column(Integer(), primary_key=True)
    created_at=Column(DateTime(), nullable=False, default=func.now())

    app_title=Column(String(32))
    app_author=Column(String(32))

    git_hash=Column(String(64))
    success=Column(Boolean())
    output=Column(Text())


class SearchRequest(mydb.Model):
    __tablename__ = 'requests_search'
    
    ID=Column(Integer(), primary_key=True)
    created_at=Column(DateTime(), nullable=False, default=func.now())

    query=Column(String(100), nullable=False)
    page=Column(Integer(), nullable=False)

    response_total=Column(Integer())
    num_items=Column(Integer())
    response=Column(MutableDict.as_mutable(JSONB))

    def get_response_total(self):
        if "total_count" in self.response:
            return int(self.response["total_count"])
        else:
            return None
    
    def get_items(self):
        if "items" in self.response:
            return self.response["items"]
        else:
            return []

class App(mydb.Model):
    __tablename__ = 'apps'
    title=Column(String(64), primary_key=True)
    author=Column(String(64), primary_key=True)
    
    category=Column(String(64))
    stars=Column(Integer())
    readme=Column(Text())

    last_commit=Column(String(64))
    downloads=Column(Integer(), nullable=False)
    created_at=Column(DateTime(), nullable=False, default=func.now())
    updated_at=Column(DateTime())

    search_json=Column(MutableDict.as_mutable(JSONB))
    repo_json=Column(MutableDict.as_mutable(JSONB))
    fam_json=Column(MutableDict.as_mutable(JSONB))

    search_vector = Column(TSVectorType('title', 'author', 'category', 'readme'))

    def __init__(self, title, author):
        self.title = title
        self.author = author
        self.downloads = 0

    def update_data(self):
        self.repo_json = read_repo_info(self)
        self.fam_json = read_app_fam(self)
        self.readme = read_readme(self)
        self.last_commit = get_last_commit(self)

        self.category = self.fam_json.get('fap_category')
        self.stars = self.repo_json.get('stargazers_count')
        self.updated_at = func.now()

    def get_meta(self):
        icon = None
        if self.fam_json.get('fap_icon'):
            icon = 'https://raw.githubusercontent.com/{}/{}/{}/{}'.format(
                self.author,
                self.title,
                self.repo_json.get('default_branch', 'master'),
                self.fam_json.get('fap_icon')
            )

        return {
            'url': 'https://github.com/{}/{}'.format(self.author, self.title),
            'downloads': self.downloads,
            
            'title': self.title,
            'author': self.author,
            
            'readme': self.readme,
            'updated_at': self.repo_json.get('pushed_at'),
            'created_at': self.repo_json.get('created_at'),
            'author_icon': self.repo_json['owner']['avatar_url'],
            'description': self.repo_json.get('description'),
            'stars': self.repo_json.get('stargazers_count'),
            'category': self.fam_json.get('fap_category'),
            'icon': icon
        }

# meta.create_all(engine)
def init_app_db(app):
    mydb.init_app(app)

    # with app.app_context():
    #     mydb.create_all()
    
    mydb.configure_mappers()
    # mydb.commit()

    migrate = Migrate(app, mydb)
    migrate.init_app(app, mydb)
