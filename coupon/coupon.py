#!/user/bin/python
# -*- coding: UTF-8 -*-

import sys
import requests
import datetime
import re
from dateutil import parser
import smtplib
from email.MIMEMultipart import MIMEMultipart
from email.MIMEText import MIMEText

numD = 1
if len(sys.argv) > 1:
    numD = int(sys.argv[1])


coupons = set()
def findCoupon( comment ):
    global coupons
    pattern = re.compile(r'\w\w\w\w-\w\w\w\w-\w\w\w\w', re.IGNORECASE)
    match = pattern.findall(comment)
    if match:
        coupons.update(match)
    return


i = 0
stop = 0
while stop == 0:
    try:
        l1 = requests.get('http://api.zhuishushenqi.com/post/by-block?block=ramble&duration=all&sort=created&start='+str(i)+'&limit=20')
    except requests.exceptions.RequestException as e:
        print e
    else:
        if l1.status_code == requests.codes.ok:
            posts = l1.json()['posts']

            if i == 0:
                current = parser.parse(posts[0]['created'])

            for post in posts:
                then = parser.parse(post['created'])
                if then < current - datetime.timedelta(days=numD):
                    stop = 1
                    break

                try:
                    l2 = requests.get('http://api.zhuishushenqi.com/post/' + post['_id'] + '/comment?start=0&limit=50')
                except requests.exceptions.RequestException as e:
                    print e
                else:
                    if l2.status_code == requests.codes.ok:
                        comments = l2.json()['comments']
                        for c in comments:
                            findCoupon( c['content'] )

    i += 20


print coupons
body = repr([x.encode(sys.stdout.encoding or sys.getdefaultencoding()) for x in coupons]).decode('string-escape')
print body

fromaddr = "user@163.com"
toaddr = "user@gmail.com"

msg = MIMEMultipart()
msg['From'] = fromaddr
msg['To'] = toaddr
msg['Subject'] = '今日兑换码'
msg.attach(MIMEText(body, 'plain'))

server = smtplib.SMTP_SSL('smtp.163.com', 994)
server.login(fromaddr, 'pass')
server.sendmail(fromaddr, toaddr, msg.as_string())
server.quit()
