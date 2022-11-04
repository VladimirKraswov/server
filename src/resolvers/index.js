const Query = require('./query');
const Mutation = require('./mutation');
const User = require('./user');
const Note = require('./note');
const {GraphQLDateTime} = require('graphql-iso-date');

const models = {
  Query,
  Mutation,
  User,
  Note,
  DateTime: GraphQLDateTime,
};

module.exports = models;
