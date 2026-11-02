import type { FastifyReply } from 'fastify';
import type { ZodError } from 'zod';

/** RFC 9457-style problem detail body. */
export interface ProblemBody {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

export function sendProblem(
  reply: FastifyReply,
  status: number,
  title: string,
  detail: string,
  instance?: string,
): void {
  const body: ProblemBody = {
    type: 'about:blank',
    title,
    status,
    detail,
    ...(instance ? { instance } : {}),
  };
  void reply.status(status).send(body);
}

export function validationDetail(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(body)'}: ${issue.message}`)
    .join('; ');
}
