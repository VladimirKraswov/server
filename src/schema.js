const {gql} = require('apollo-server-express');

// Строим схему, используя язык схем GraphQL
module.exports = gql`
  scalar DateTime
  type User {
    id: ID!
    username: String!
    email: String!
    avatar: String
    notes: [Note!]!
    favorites: [Note!]!
  }
  type NoteFeed {
    notes: [Note]!
    cursor: String!
    hasNextPage: Boolean!
  }
  type Note {
    id: ID!
    content: String!
    author: User!
    createdAt: DateTime!
    updatedAt: DateTime!
    favoriteCount: Int!
    favoritedBy: [User!]
  }
  type Query {
    user(username: String!): User
    users: [User!]!
    me: User!
    noteFeed(cursor: String): NoteFeed
    notes: [Note]
    note(id: ID): Note
  }
  type Mutation {
    signUp(username: String!, email: String!, password: String!): String!
    signIn(username: String, email: String, password: String!): String!
    newNote(content: String!): Note!
    updateNote(id: ID!, content: String!): Note!
    deleteNote(id: ID!): Boolean!
    toggleFavorite(id: ID!): Note!
  }
`;
