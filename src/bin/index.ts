#!/usr/bin/env node
/* eslint-disable no-new */
import Bridge from '../bridge';
import BinError from './errorhandler';
import XdccJSbin from './xdccjs';

try {
  new XdccJSbin();
} catch (e) {
  if (e instanceof BinError) {
    console.error(Bridge.replace(e.message));
  }
}
