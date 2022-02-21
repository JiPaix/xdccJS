/* eslint-disable no-async-promise-executor */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import fetch, { Response } from 'node-fetch';

type raceResults = [
  PromiseSettledResult<Response>,
  PromiseSettledResult<Response>,
  PromiseSettledResult<Response>
];

async function fetchWithTimeout(resource:string) {
  const options = { timeout: 1000 };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), options.timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
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
        const text = await result.value.text();
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
