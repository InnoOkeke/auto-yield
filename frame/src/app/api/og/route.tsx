import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0c4a6e 0%, #701a75 100%)',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '32px',
                        padding: '60px 80px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                    }}
                >
                    <h1
                        style={{
                            fontSize: '80px',
                            fontWeight: 'bold',
                            background: 'linear-gradient(90deg, #7dd3fc 0%, #f0abfc 100%)',
                            backgroundClip: 'text',
                            color: 'transparent',
                            marginBottom: '20px',
                        }}
                    >
                        Meluri Auto Yield
                    </h1>
                    <p
                        style={{
                            fontSize: '36px',
                            color: 'rgba(255, 255, 255, 0.9)',
                            marginBottom: '40px',
                        }}
                    >
                        Automated DeFi Savings on Base
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            gap: '40px',
                            marginTop: '20px',
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#fff' }}>~12.5%</p>
                            <p style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>APY</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#fff' }}>$250K+</p>
                            <p style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>Total Saved</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '48px', fontWeight: 'bold', color: '#fff' }}>500+</p>
                            <p style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.6)' }}>Users</p>
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
