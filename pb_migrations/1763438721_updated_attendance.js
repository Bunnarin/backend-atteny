/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_473016918")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number2752330789",
    "max": 288,
    "min": -1,
    "name": "start",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number517587069",
    "max": 288,
    "min": -1,
    "name": "end",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_473016918")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number2752330789",
    "max": 288,
    "min": -1,
    "name": "start_minute",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number517587069",
    "max": 288,
    "min": -1,
    "name": "end_minute",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
