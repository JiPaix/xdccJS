/* eslint-disable no-eval */
/* eslint-disable no-unused-vars */
/* eslint-disable no-redeclare */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-async-promise-executor */
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

async function findBestResults(res: raceResults): Promise<{'v6': string}>
async function findBestResults(res: raceResults): Promise<{'v4': string}>
async function findBestResults(res: raceResults): Promise<{'v4'?: string, 'v6'?: string}> {
  const IpRegex = (await (eval('import("ip-regex")') as Promise<typeof import('ip-regex')>)).default;
  return new Promise(async (resolve, reject) => {
    for (const [i, result] of res.entries()) {
      if (result.status === 'fulfilled') {
        const text = result.value.data;
        const v4 = text.match(IpRegex.v4());
        const v6 = text.match(IpRegex.v6());
        if (v4 && v6) {
          resolve({ v4: v4[0], v6: v6[0] });
        } else if (v4) {
          resolve({ v4: v4[0] });
          break;
        } else if (v6) {
          resolve({ v6: v6[0] });
          break;
        } else if (i === res.length - 1) {
          reject(new Error('Could not get IP'));
          break;
        }
      }
    }
  });
}

export default async function getIp(): Promise<{'v4'?: string, 'v6'?: string}> {
  return findBestResults(await fetchIp());
}
