#!/usr/bin/env python

from bs4 import BeautifulSoup
import filelock
import os
import re
import shutil
import time
import urllib.request

class LMPLoader(object):

    def __init__(self, url, cache_file, cache_time):
        self.url = url
        self.cache_file = cache_file
        self.cache_time = cache_time

    def download(self):
        with filelock.FileLock(self.cache_file + ".lock"):
            download = False
            try:
                mod_time = os.path.getmtime(self.cache_file)
                now = time.time()
                diff_time = now - mod_time
                if diff_time > self.cache_time:
                    download = True
            except os.error:
                download = True

            if download:
                with urllib.request.urlopen(self.url) as response, open(self.cache_file, 'wb') as out_file:
                    shutil.copyfileobj(response, out_file)


    def parse(self):
        self.download()
        with open(self.cache_file) as fp:
            soup = BeautifulSoup(fp, "html.parser")
            return {
                'last_updated': self._last_updated(soup),
                'lmp': self._lmp(soup),
                'agg_lmp': self._agg_lmp(soup),
                'transfer': self._transfer(soup),
                'load': self._load(soup),
                'limits': self._limits(soup),
            }


    def _last_updated(self, soup):
        busHeading = soup.find(text=re.compile(r'Data Last Updated'))
        busTable = busHeading.parent.parent.next_sibling.next_sibling
        tr = busTable("tr")[0]
        td = tr("td")[0]
        last_updated = td("b")[0].get_text()
        return last_updated


    def _lmp(self, soup):
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
        return data

    def _agg_lmp(self, soup):
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
        return data

    def _transfer(self, soup):
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
        return data

    def _load(self, soup):
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
        return data

    def _limits(self, soup):
        busHeading = soup.find(text=re.compile(r'Current PJM Transmission Limits'))
        limits = busHeading.parent.parent.next_sibling.next_sibling

        return limits.get_text()

