import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Readable } from 'stream';

/**
 * VirusScanService — wraps ClamAV daemon (clamd) via the `clamscan` package.
 *
 * ## Production deployment
 *   Run a ClamAV sidecar container (clamav/clamav on Docker Hub) alongside
 *   the API and set CLAMAV_HOST / CLAMAV_PORT to point at the daemon.
 *   Alternatively, enable AWS GuardDuty Malware Protection for S3 as a
 *   complementary post-upload layer.
 *
 * ## Local development
 *   Set VIRUS_SCAN_ENABLED=false in .env to skip scanning when clamd is
 *   not installed locally. NEVER set this in production.
 *
 * ## Environment variables
 *   VIRUS_SCAN_ENABLED  "false" to disable (default: enabled)
 *   CLAMAV_HOST         clamd TCP host      (default: 127.0.0.1)
 *   CLAMAV_PORT         clamd TCP port      (default: 3310)
 */
@Injectable()
export class VirusScanService implements OnModuleInit {
  private readonly logger = new Logger(VirusScanService.name);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private clamav: any = null;

  private readonly enabled: boolean =
    process.env.VIRUS_SCAN_ENABLED !== 'false';

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.warn(
        'Virus scanning is DISABLED (VIRUS_SCAN_ENABLED=false). Never disable in production.',
      );
      return;
    }

    try {
      // Dynamic import keeps startup fast and avoids hard failures if the
      // package is missing in an environment where scanning is disabled.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const NodeClam = require('clamscan');
      const instance = await new NodeClam().init({
        clamdscan: {
          host: process.env.CLAMAV_HOST ?? '127.0.0.1',
          port: parseInt(process.env.CLAMAV_PORT ?? '3310', 10),
          timeout: 30_000,
          active: true,
        },
        preference: 'clamdscan',
      });
      this.clamav = instance;
      this.logger.log('ClamAV daemon connected successfully');
    } catch (err) {
      const msg = `Failed to connect to ClamAV daemon: ${(err as Error).message}`;
      if (process.env.NODE_ENV === 'production') {
        // Fail the application startup rather than silently skip scanning.
        this.logger.error(msg);
        throw new Error(msg);
      }
      // In development: log a warning and degrade gracefully.
      this.logger.warn(
        `${msg} — virus scanning will be skipped for this session (development only).`,
      );
    }
  }

  /**
   * Scan a file buffer for malware using ClamAV.
   *
   * @throws {BadRequestException} if the file is flagged as infected.
   * No-ops when ClamAV is unavailable (development degradation only).
   */
  async scan(buffer: Buffer, filename = 'upload'): Promise<void> {
    if (!this.clamav) return; // disabled or failed to connect (dev only)

    const stream = Readable.from(buffer);
    const { isInfected, viruses } = (await this.clamav.scanStream(stream)) as {
      isInfected: boolean;
      viruses: string[] | null;
    };

    if (isInfected) {
      const detected = viruses?.join(', ') ?? 'unknown';
      this.logger.error(`Infected file rejected — file: ${filename}, threat: ${detected}`);
      throw new BadRequestException('File failed virus scan and was rejected.');
    }
  }
}
