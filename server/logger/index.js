/**
 * Logger Module Entry Point
 *
 * Exports logger classes and factory for use throughout the application
 */

const ILogger = require('./ILogger');
const ApplicationInsightsLogger = require('./ApplicationInsightsLogger');
const ConsoleLogger = require('./ConsoleLogger');
const LoggerFactory = require('./LoggerFactory');

module.exports = {
  ILogger,
  ApplicationInsightsLogger,
  ConsoleLogger,
  LoggerFactory
};