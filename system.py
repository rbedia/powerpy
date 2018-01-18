#!/usr/bin/env python

from bs4 import BeautifulSoup
import filelock
import os
import re
import shutil
import time
import urllib.request

def download(url, write_file, cache_time):
    with filelock.FileLock(write_file + ".lock"):
        download = False
        try:
            mod_time = os.path.getmtime(write_file)
            now = time.time()
            diff_time = now - mod_time
            if diff_time > cache_time:
                download = True
        except os.error:
            download = True

        if download:
            with urllib.request.urlopen(url) as response, open(write_file, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)

def parse_lmp(system_file):
    with open(system_file) as fp:
        soup = BeautifulSoup(fp, "html.parser")

        busHeading = soup.find(text=re.compile(r'500 KV Bus.*'))
        busTable = busHeading.parent.parent.next_sibling.next_sibling

        data = []
        rows = busTable.find_all("tr")
        for row in rows:
            td = row("td")
            name = td[0].get_text().strip()
            minute_lmp = td[1].get_text()
            hour_lmp = td[2].get_text()
            if name != "Bus Name":
                record = {'name': name, 'minute_lmp': minute_lmp, 'hour_lmp': hour_lmp}
                data.append(record)
        return {'lmp': data}

def parse_agg_lmp(system_file):
    with open(system_file) as fp:
        soup = BeautifulSoup(fp, "html.parser")

        busHeading = soup.find(text=re.compile(r'Aggregate Locational Marginal Prices.*'))
        busTable = busHeading.parent.parent.next_sibling.next_sibling

        data = []
        rows = busTable.find_all("tr")
        for row in rows:
            td = row("td")
            name = td[0].get_text().strip()
            agg_type = td[1].get_text()
            minute_lmp = td[2].get_text()
            hour_lmp = td[3].get_text()
            if name != "Name":
                record = {'name': name, 'type': agg_type, 'minute_lmp': minute_lmp, 'hour_lmp': hour_lmp}
                data.append(record)
        return {'agg_lmp': data}

def parse_transfer(system_file):
    with open(system_file) as fp:
        soup = BeautifulSoup(fp, "html.parser")

        busHeading = soup.find(text=re.compile(r'PJM Transfer Interface Information.*'))
        busTable = busHeading.parent.next_sibling.next_sibling

        data = []
        rows = busTable.find_all("tr")
        for row in rows:
            td = row("td")
            interface = td[0].get_text().strip()
            flow = td[1].get_text()
            warning_level = td[2].get_text()
            transfer_level = td[3].get_text()
            if interface != "Interface":
                record = {'interface': interface, 'flow': flow, 'warning_level':
                        warning_level, 'transfer_level': transfer_level}
                data.append(record)
        return {'transfer': data}

def parse_load(system_file):
    with open(system_file) as fp:
        soup = BeautifulSoup(fp, "html.parser")

        busHeading = soup.find(text=re.compile(r'PJM Instantaneous Load.*'))
        busTable = busHeading.parent.parent.next_sibling.next_sibling

        data = []
        rows = busTable.find_all("tr")
        for row in rows:
            td = row("td")
            area = td[0].get_text().strip()
            load = td[1].get_text()
            if area != "Area":
                record = {'area': area, 'load': load}
                data.append(record)
        return {'load': data}

def parse_limits(system_file):
    with open(system_file) as fp:
        soup = BeautifulSoup(fp, "html.parser")

        busHeading = soup.find(text=re.compile(r'Current PJM Transmission Limits'))
        limits = busHeading.parent.parent.next_sibling.next_sibling

        return {'limits': limits.get_text()}

if __name__ == '__main__':
    pjm_url = 'http://oasis.pjm.com/system.htm'
    system_file = '/tmp/system2.htm'
    cache_time = 5 * 60
    download(pjm_url, system_file, cache_time)
    print(parse_lmp(system_file))
    print(parse_agg_lmp(system_file))
    print(parse_transfer(system_file))
    print(parse_load(system_file))
    print(parse_limits(system_file))

