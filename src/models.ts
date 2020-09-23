import Joi from "@hapi/joi";

export interface JoiModelObject {
  [key: string]: Joi.Schema;
}

export interface ValidateModel {
  body?: Joi.ObjectSchema<JoiModelObject> | JoiModelObject;
  query?: Joi.ObjectSchema<JoiModelObject> | JoiModelObject;
  params?:  Joi.ObjectSchema<JoiModelObject> | JoiModelObject;
}
