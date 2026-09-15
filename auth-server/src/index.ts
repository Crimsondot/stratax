import "dotenv/config";
import express from "express";
import cors from "cors";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { toNodeHandler } from "better-auth/node";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import nodemailer from "nodemailer";
import * as schema from "./db/schema.js";

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter connection on startup
transporter.verify((error) => {
  if (error) {
    console.error("SMTP connection error:", error.message);
  } else {
    console.log("SMTP server connected successfully.");
  }
});

// Initialize database
const sqlite = new Database(process.env.DATABASE_URL || "./strata-x-auth.db");
const db = drizzle(sqlite, { schema });

// Initialize Better Auth
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  trustedOrigins: [process.env.CORS_ORIGIN || "http://localhost:5173"],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        const mailOptions = {
          from: process.env.SMTP_FROM || "noreply@strata-x.dev",
          to: email,
          subject: "Your Strata-X Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0284c7;">MineGuard AI</h2>
              <p>Your verification code is:</p>
              <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${otp}</span>
              </div>
              <p style="color: #64748b; font-size: 12px;">This code expires in 5 minutes. Do not share it with anyone.</p>
            </div>
          `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}: ${otp}`);
      },
      otpLength: 6,
      expiresIn: 300,
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});

// Express app
const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// Better Auth — use built-in Node handler
const nodeHandler = toNodeHandler(auth);

app.all("/api/auth/*", (req, res) => {
  nodeHandler(req, res);
});

app.all("/api/auth", (req, res) => {
  nodeHandler(req, res);
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "strata-x-auth-server" });
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
