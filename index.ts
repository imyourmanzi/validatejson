import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { ValidationError, Validator } from 'express-json-validator-middleware';
import { Static, Type } from '@sinclair/typebox';

const PORT = 3000;

/**
 * Define a JSON schema.
 */
const T1Schema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  timestamp: Type.Number(),
});
type T1 = Static<typeof T1Schema>;
// starts out as `undefined`, which is operates as true
console.log('allows extra properties:', T1Schema.additionalProperties);

enum T2Enum {
  Blue = 'Blue',
  Brown = 'Brown',
  Yellow = 'Yellow',
}
const enum T2ConstEnum {
  Blue = 'Blue',
  Brown = 'Brown',
  Yellow = 'Yellow',
}
const T2Schema = Type.Object({
  id: Type.Number({ maximum: 3 }),
  dogId: Type.String({ format: 'uuid' }),
  /**
   * const enums in typescript aren't values so we can't use them to get their
   * values for the JSON schema because they're never stored in memory
   * https://stackoverflow.com/a/45942460
   */
  color: Type.Enum(T2Enum),
});
T2Schema.additionalProperties = false;
type T2 = Static<typeof T2Schema>;

const app = express();
app.use(express.json());

/**
 * Initialize a `Validator` instance, optionally passing in
 * an Ajv options object.
 *
 * @see https://github.com/ajv-validator/ajv/tree/v6#options
 */
const validator = new Validator({ logger: console });

app.post('/1', validator.validate({ body: T1Schema }), (req, res) => {
  const jsonBody = req.body as T1;

  res.json({
    sentId: jsonBody.id,
    sentName: jsonBody.name,
    sentTimestamp: jsonBody.timestamp,
  });
});

app.post('/2', validator.validate({ body: T2Schema }), (req, res) => {
  const jsonBody = req.body as T2;

  res.json({
    sentId: jsonBody.id,
    sentDogId: jsonBody.dogId,
    sentColor: jsonBody.color,
  });
});

/**
 * Error handler middleware for validation errors.
 */
app.use(
  (
    error: unknown,
    request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    // Check the error is a validation error
    if (error instanceof ValidationError) {
      // Handle the error
      response.status(400).json({
        error: 'Bad Request',
        reason: { validation: error.validationErrors },
      });
      return;
    }

    console.error(error, { detail: 'unexpected error' });
    response.status(500).json({ error: 'Internal Error' });
  },
);

app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
