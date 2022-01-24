export class RtGuard extends AuthGuard('jwt') {
    constructor() {
        super();
    }
}