const { DataTypes, Model } = require('sequelize')

const uppercaseFirst = str => `${str[0].toUpperCase()}${str.substr(1)}`

/*
 * Polymorphic association: https://sequelize.org/docs/v6/advanced-association-concepts/polymorphic-associations/
 * Book has many MediaProgress. PodcastEpisode has many MediaProgress.
 */
module.exports = (sequelize) => {
  class MediaProgress extends Model {
    getMediaItem(options) {
      if (!this.mediaItemType) return Promise.resolve(null)
      const mixinMethodName = `get${uppercaseFirst(this.mediaItemType)}`
      return this[mixinMethodName](options)
    }
  }

  MediaProgress.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    mediaItemId: DataTypes.UUIDV4,
    mediaItemType: DataTypes.STRING,
    duration: DataTypes.INTEGER,
    currentTime: DataTypes.INTEGER,
    isFinished: DataTypes.BOOLEAN,
    hideFromContinueListening: DataTypes.BOOLEAN,
    finishedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'MediaProgress'
  })

  const { Book, PodcastEpisode, User } = sequelize.models
  Book.hasMany(MediaProgress, {
    foreignKey: 'mediaItemId',
    constraints: false,
    scope: {
      mediaItemType: 'book'
    }
  })
  MediaProgress.belongsTo(Book, { foreignKey: 'mediaItemId', constraints: false })

  PodcastEpisode.hasMany(MediaProgress, {
    foreignKey: 'mediaItemId',
    constraints: false,
    scope: {
      mediaItemType: 'podcastEpisode'
    }
  })
  MediaProgress.belongsTo(PodcastEpisode, { foreignKey: 'mediaItemId', constraints: false })

  MediaProgress.addHook('afterFind', findResult => {
    if (!Array.isArray(findResult)) findResult = [findResult]
    for (const instance of findResult) {
      if (instance.mediaItemType === 'book' && instance.Book !== undefined) {
        instance.MediaItem = instance.Book
      } else if (instance.mediaItemType === 'podcastEpisode' && instance.PodcastEpisode !== undefined) {
        instance.MediaItem = instance.PodcastEpisode
      }
      // To prevent mistakes:
      delete instance.Book
      delete instance.dataValues.Book
      delete instance.PodcastEpisode
      delete instance.dataValues.PodcastEpisode
    }
  })

  User.hasMany(MediaProgress)
  MediaProgress.belongsTo(User)

  return MediaProgress
}