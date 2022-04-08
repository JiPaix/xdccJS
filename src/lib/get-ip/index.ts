/* eslint-disable no-async-promise-executor */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import axios, { AxiosResponse } from 'axios';

type raceResults = [
  PromiseSettledResult<AxiosResponse<string>>,
  PromiseSettledResult<AxiosResponse<string>>,
  PromiseSettledResult<AxiosResponse<string>>,
];

async function fetchWithTimeout(source:string) {
  return axios.get(source, { timeout: 1000 });
}

async function fetchIp() {
  const ipify = fetchWithTimeout('https://api.ipify.org');
  const cloudflare = fetchWithTimeout('https://www.cloudflare.com/cdn-cgi/trace');
  const amazon = fetchWithTimeout('https://checkip.amazonaws.com/');
  const res = Promise.allSettled([cloudflare, amazon, ipify]);
  return res;
}

async function findBestResults(res: raceResults): Promise<string> {
  const ipRegex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/gm;
  return new Promise(async (resolve, reject) => {
    for (const [i, result] of res.entries()) {
      if (result.status === 'fulfilled') {
        const text = result.value.data;
        const ip = ipRegex.exec(text);
        if (ip) {
          resolve(ip[0]);
          break;
        }
        if (!ip && i === 2) {
          reject(new Error('Could not get IP'));
        }
      }
    }
  });
}

export default async function getIp(): Promise<string> {
  return findBestResults(await fetchIp());
}
