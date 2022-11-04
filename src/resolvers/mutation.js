require('dotenv').config();
const {AuthenticationError, ForbiddenError} = require('apollo-server-express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const gravatar = require('../util/gravatar');

module.exports = {
  signUp: async (parent, {username, email, password}, {models}) => {
    email = email.trim().toLowerCase(); // Нормализуем имейл
    const hashed = await bcrypt.hash(password, 10); // Хешируем пароль
    const avatar = gravatar(email); // Создаем url gravatar-изображения

    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hashed,
      });
      return jwt.sign({id: user._id}, process.env.JWT_SECRET); // Создаем и возвращаем json web token
    } catch (err) {
      console.log(err);
      throw new Error('Error creating account'); // Если при регистрации возникла проблема, выбрасываем ошибку
    }
  },
  signIn: async (parent, {username, email, password}, {models}) => {
    if (email) {
      email = email.trim().toLowerCase(); // Нормализуем e-mail
    }
    const user = await models.User.findOne({
      $or: [{email}, {username}],
    });
    // Если пользователь не найден, выбрасываем ошибку аутентификации
    if (!user) {
      throw new AuthenticationError('Error signing in');
    }
    // Если пароли не совпадают, выбрасываем ошибку аутентификации
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AuthenticationError('Error signing in');
    }
    return jwt.sign({id: user._id}, process.env.JWT_SECRET); // Создаем и возвращаем json web token
  },
  newNote: async (parent, args, {models, user}) => {
    // Если в контексте нет пользователя, выбрасываем AuthenticationError
    if (!user) {
      throw new AuthenticationError('You must be signed in to create a note');
    }
    return models.Note.create({
      content: args.content,
      author: mongoose.Types.ObjectId(user.id), // Ссылаемся на mongo id автора
    });
  },
  deleteNote: async (parent, {id}, {models, user}) => {
    // Если не пользователь, выбрасываем ошибку авторизации
    if (!user) {
      throw new AuthenticationError('You must be signed in to delete a note');
    }
    // Находим заметку
    const note = await models.Note.findById(id);
    // Если владелец заметки и текущий пользователь не совпадают, выбрасываем // запрет на действие
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError("You don't have permissions to delete the note");
    }
    try {
      await note.remove(); // Если все проверки проходят, удаляем заметку
      return true;
    } catch (err) {
      return false; // Если в процессе возникает ошибка, возвращаем false
    }
  },
  updateNote: async (parent, {content, id}, {models, user}) => {
    // Если не пользователь, выбрасываем ошибку авторизации
    if (!user) {
      throw new AuthenticationError('You must be signed in to update a note');
    }

    const note = await models.Note.findById(id); // Находим заметку
    // Если владелец заметки и текущий пользователь не совпадают, выбрасываем // запрет на действие
    if (note && String(note.author) !== user.id) {
      throw new ForbiddenError("You don't have permissions to update the note");
    }
    // Обновляем заметку в БД и возвращаем ее в обновленном виде
    return models.Note.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          content,
        },
      },
      {
        new: true,
      },
    );
  },
  toggleFavorite: async (parent, {id}, {models, user}) => {
    // Если контекст пользователя не передан, выбрасываем ошибку
    if (!user) {
      throw new AuthenticationError();
    }

    let noteCheck = await models.Note.findById(id); // Проверяем, отмечал ли пользователь заметку как избранную
    const hasUser = noteCheck.favoritedBy.indexOf(user.id);
    // Если пользователь есть в списке, удаляем его оттуда и уменьшаем значение favoriteCount на 1
    if (hasUser >= 0) {
      return models.Note.findByIdAndUpdate(
        id,
        {
          $pull: {
            favoritedBy: mongoose.Types.ObjectId(user.id),
          },
          $inc: {
            favoriteCount: -1,
          },
        },
        {
          new: true,
        },
      );
    } else {
      // Если пользователя в списке нет, добавляем его туда и увеличиваем
      // значение favoriteCount на 1
      return models.Note.findByIdAndUpdate(
        id,
        {
          $push: {
            favoritedBy: mongoose.Types.ObjectId(user.id),
          },
          $inc: {
            favoriteCount: 1,
          },
        },
        {
          new: true,
        },
      );
    }
  },
};
