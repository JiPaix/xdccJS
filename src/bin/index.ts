#!/usr/bin/env node
import { XdccJSbin } from './xdccjs'
import { BinError } from './errorhandler'
import { Connect } from '../connect'

try {
  new XdccJSbin()
} catch (e) {
  if (e instanceof BinError) {
    console.error(Connect.replace(e.message))
  }
}
