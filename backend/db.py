import os

from sqlalchemy import create_engine, Column, String, Integer, ForeignKey, MetaData, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.sql import func

from github import read_app_fam, read_repo_info, read_readme

from flask_sqlalchemy import SQLAlchemy
mydb = SQLAlchemy()

def get_or_create(model, **kwargs):
    instance = session.query(model).filter_by(**kwargs).first()
    if instance:
        return instance
    else:
        instance = model(**kwargs)
        session.add(instance)
        session.commit()
        return instance

class App(mydb.Model):
    __tablename__ = 'apps'
    title=Column(String(32), primary_key=True)
    author=Column(String(32), primary_key=True)
    
    category=Column(String(32))
    stars=Column(Integer())
    readme=Column(Text())

    downloads=Column(Integer(), nullable=False, )
    created_at=Column(DateTime())
    updated_at=Column(DateTime())

    search_json=Column(MutableDict.as_mutable(JSONB))
    repo_json=Column(MutableDict.as_mutable(JSONB))
    fam_json=Column(MutableDict.as_mutable(JSONB))

    def __init__(self, title, author):
        self.title = title
        self.author = author
        self.created_at=func.now()
        self.downloads = 0

    def update_data(self):
        self.repo_json = read_repo_info(self)
        self.fam_json = read_app_fam(self)
        self.readme = read_readme(self)

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

    with app.app_context():
        mydb.create_all()