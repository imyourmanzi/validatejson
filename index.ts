import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { ValidationError, Validator } from 'express-json-validator-middleware';
import { Static, Type } from '@sinclair/typebox';

const PORT = 3000;

/**
 * Define a JSON schema.
 */
const TSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  timestamp: Type.Number(),
});

// starts out as `undefined`, which is operates as true
console.log('allows extra properties:', TSchema.additionalProperties);

type T = Static<typeof TSchema>;

const app = express();
app.use(express.json());

/**
 * Initialize a `Validator` instance, optionally passing in
 * an Ajv options object.
 *
 * @see https://github.com/ajv-validator/ajv/tree/v6#options
 */
const validator = new Validator({ logger: console });

app.post('/', validator.validate({ body: TSchema }), (req, res) => {
  const jsonBody = req.body as T;

  res.json({
    sentId: jsonBody.id,
    sentName: jsonBody.name,
    sentTimestamp: jsonBody.timestamp,
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
