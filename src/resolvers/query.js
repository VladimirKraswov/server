const MAX_QUERY_ENTITIES = 100;
const LIMIT = 10; // Жестко кодируем лимит в 10 элементов

module.exports = {
  user: async (parent, {username}, {models}) => {
    return models.User.findOne({username}); // Находим пользователя по имени
  },
  users: async (parent, args, {models}) => {
    return models.User.find({}).limit(MAX_QUERY_ENTITIES); // Находим всех пользователей
  },
  me: async (parent, args, {models, user}) => {
    return models.User.findById(user.id); // Находим пользователя по текущему пользовательскому контексту
  },
  notes: async (parent, args, {models}) => models.Note.find().limit(MAX_QUERY_ENTITIES),
  note: async (parent, args, {models}) => models.Note.findById(args.id),
  noteFeed: async (parent, {cursor}, {models}) => {
    let hasNextPage = false;
    let cursorQuery = {}; // Если курсор передан не будет, то по умолчанию запрос будет пуст. В таком случае из БД будут извлечены последние заметки
    // Если курсор задан, запрос будет искать заметки со значением ObjectId меньше этого курсора
    if (cursor) {
      cursorQuery = {_id: {$lt: cursor}};
    }
    // Находим в БД limit + 1 заметок, сортируя их от старых к новым
    let notes = await models.Note.find(cursorQuery)
      .sort({_id: -1})
      .limit(LIMIT + 1);
    // Если число найденных заметок превышает limit, устанавливаем hasNextPage как true и обрезаем заметки до лимита
    if (notes.length > LIMIT) {
      hasNextPage = true;
      notes = notes.slice(0, -1);
    }
    // Новым курсором будет ID Mongo-объекта последнего элемента массива списка
    const newCursor = notes[notes.length - 1]._id;
    return {
      notes,
      cursor: newCursor,
      hasNextPage,
    };
  },
};
