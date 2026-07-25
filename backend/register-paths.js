/**
 * Permite que el codigo bajo Modulos (via junction) resuelva
 * dependencias desde backend/node_modules.
 */
const path = require('path')
const Module = require('module')

process.env.NODE_PATH = path.join(__dirname, 'node_modules')
Module._initPaths()
