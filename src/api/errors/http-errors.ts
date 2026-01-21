export type HttpErrorDetails = Record<string, unknown>;

export class HttpError extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly details?: HttpErrorDetails;

    constructor(opts: { status: number; code: string; message: string; details?: HttpErrorDetails }) {
        super(opts.message);
        this.name = this.constructor.name;
        this.status = opts.status;
        this.code = opts.code;
        this.details = opts.details;
    }
}
export class WrongParameters extends HttpError {
    constructor(message = "Invalid request parameters", details?: Record<string, unknown>) {
        super({ status: 400, code: "WRONG_PARAMETERS", message, details });
    }
}

export class NotFound extends HttpError {
    constructor(message = "Resource not found", details?: Record<string, unknown>) {
        super({ status: 404, code: "NOT_FOUND", message, details });
    }
}