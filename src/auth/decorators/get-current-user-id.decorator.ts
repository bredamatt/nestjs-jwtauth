import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetCurrentUserId = createParamDecorator(
    (data: undefined, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        if(!data) return request.user;
        return request.user['sub'];
    },
);