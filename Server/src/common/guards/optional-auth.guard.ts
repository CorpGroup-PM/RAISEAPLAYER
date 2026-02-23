import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;


    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.user = null;
      return true;
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      console.log('JWT PAYLOAD =>', payload);
      request.user = payload;
    } catch (e) {
      console.log('JWT VERIFY FAILED');
      request.user = null;
    }

    return true;
  }
}
