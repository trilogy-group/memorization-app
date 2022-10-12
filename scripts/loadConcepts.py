import requests, json
import subprocess, os, sys
import logging
import MySQLdb

db_host = "localhost"
db_user = "sammy"
db_name = "memoryapp"
password = "admin"
port = 3306
login_session = {}
connect_pool=[]
log_filename = 'conceptstore_log.txt'

cmd =  ['bash', 'get_concepts.sh']

logging.basicConfig(level=logging.INFO)


def connectDB():
    connect=MySQLdb.connect(host=db_host,password=password, user=db_user, db=db_name, port=port)
    logging.info("Connected to DB")
    return connect


def get_connect():
    global connect_pool
    if not connect_pool:
        connect_tmp=connectDB()
        connect_pool.append(connect_tmp)
    return connect_pool.pop()


def get_cg_tree():
    logging.info(cmd)

    p = subprocess.run(cmd, capture_output=True)
    cg_tree = json.loads(p.stdout)

    domains_lst = cg_tree['data']['domains']
    return domains_lst


def insert_question(conceptId, question, db, c):
    # Only for MCQ
    # Ignore question id due to duplications in data source
    cmd = "INSERT IGNORE INTO Quiz (name, type, options, conceptId) VALUES ('" + question['desc'].replace('\'', '\\\'').replace('\"', '\\\"') + "', '" + question['type'] + "', '" + str(question['options']).replace('\'', '\\\'').replace('\"', '\\\"') + "', '"+ conceptId +"');"
    logging.debug(cmd)
    c.execute(cmd)

def insert_concept(skillId, concept, db, c):
    cmd = "INSERT IGNORE INTO Concept (id, name, skillId) VALUES ('" + concept['id'] + "', '" + concept['name'].replace('\'', '\\\'').replace('\"', '\\\"') + "', '" + skillId + "');"
    logging.debug(cmd)
    c.execute(cmd)
    for question in concept['questions']:
        insert_question(concept['id'], question, db, c)


def insert_skill(domainId, skill, db, c):
    cmd = "INSERT IGNORE INTO Skill (id, name, domainId) VALUES ('" + skill['id'] + "', '" + skill['name'].replace('\'', '\\\'').replace('\"', '\\\"') + "', '" + domainId + "');"
    c.execute(cmd)

    concepts = skill['concepts']
    for concept in concepts:
        insert_concept(skill['id'], concept, db, c)


def insert_domain(domain, db, c):
    subjectId = "SUB2"
    cmd = "INSERT IGNORE INTO Domain (id, name, subjectId) VALUES ('" + domain['id'] + "', '" + domain['name'].replace('\'', '\\\'').replace('\"', '\\\"') + "', '" + subjectId + "');"
    c.execute(cmd)

    skills = domain['skills']
    for skill in skills:
        insert_skill(domain['id'], skill, db, c)


if __name__ == "__main__":
    f = open(log_filename, 'w')
    domains_lst = get_cg_tree()
    db = get_connect()
    c = db.cursor()

    # Insert subject
    c.execute("INSERT IGNORE INTO Subject (id, name) VALUES (\"SUB2\", \"World History\");")
    for domain in domains_lst:
        insert_domain(domain, db, c)

    r = c.fetchall()
    f.write(str(r))
    db.commit()
    db.close()
