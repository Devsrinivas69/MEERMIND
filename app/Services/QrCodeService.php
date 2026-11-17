<?php

namespace App\Services;

use App\Models\Ticket;
use BaconQrCode\Renderer\Color\Rgb;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\Fill;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Str;

class QrCodeService
{
    /**
     * Generate an SVG QR code string.
     */
    public function generateSvg(string $data, int $size = 220): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(
                $size,
                1,
                null,
                null,
                Fill::uniformColor(new Rgb(255, 255, 255), new Rgb(15, 17, 21))
            ),
            new SvgImageBackEnd
        );

        $writer = new Writer($renderer);

        return $writer->writeString($data);
    }

    /**
     * Generate a cryptographically signed opaque token for a ticket.
     */
    public function generateToken(int $registrationId, int $eventId): string
    {
        $payload = sprintf(
            'meetmind:%d:%d:%s:%d',
            $registrationId,
            $eventId,
            Str::random(16),
            now()->timestamp
        );

        return hash_hmac('sha256', $payload, config('app.key'));
    }

    /**
     * Generate a human-readable unique ticket identifier.
     */
    public function generateTicketCode(): string
    {
        $year = date('Y');
        $random = strtoupper(Str::random(6));

        return "MM-{$year}-{$random}";
    }
}
