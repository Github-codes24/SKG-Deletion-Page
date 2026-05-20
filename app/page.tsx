"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type PolicyResponse = {
  description: string;
  source: "api" | "fallback";
  account?: {
    name?: string;
    phone?: string;
    email?: string;
    appType?: string;
  } | null;
};

type AppType = "user" | "driver";

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@skgtravel.com";

const initialPolicy =
  "All personal data will be permanently removed from our systems within 7 working days.";

function makeReference() {
  return `SKG-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export default function Home() {
  const [appType, setAppType] = useState<AppType>("user");
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [policy, setPolicy] = useState(initialPolicy);
  const [policySource, setPolicySource] =
    useState<PolicyResponse["source"]>("fallback");
  const [reference, setReference] = useState("");

  // Account lookup state
  const [lookupStatus, setLookupStatus] = useState<
    "idle" | "loading" | "found" | "not-found" | "error"
  >("idle");
  const [accountInfo, setAccountInfo] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    appType?: string;
  } | null>(null);

  // Submission state
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/delete-policy")
      .then((response) => response.json())
      .then((data: PolicyResponse) => {
        if (!active) {
          return;
        }

        setPolicy(data.description || initialPolicy);
        setPolicySource(data.source || "fallback");
      })
      .catch(() => {
        if (active) {
          setPolicy(initialPolicy);
          setPolicySource("fallback");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const mailToHref = useMemo(() => {
    const subject = reference
      ? `[${reference}] SKG TRAVEL ${appType} account deletion request`
      : `SKG TRAVEL ${appType} account deletion request`;

    const body = [
      "Hello SKG TRAVEL team,",
      "",
      reference ? `Reference number: ${reference}` : null,
      "",
      `Please delete my ${appType === "driver" ? "Driver" : "User"} app account and associated data.`,
      "",
      `Full name: ${fullName || "[enter full name]"}`,
      `Registered phone or email: ${identifier || "[enter registered phone/email]"}`,
      `App type: ${appType === "driver" ? "Driver App" : "User App"}`,
      notes ? `Additional details: ${notes}` : "Additional details: [optional]",
      "",
      "I understand that completed trips, invoices, payment, safety, security, fraud-prevention, tax, and legal records may be retained where required by law.",
    ]
      .filter(Boolean)
      .join("\n");

    return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [appType, fullName, identifier, notes, reference]);

  async function handleLookup() {
    if (!identifier.trim()) return;

    setLookupStatus("loading");

    try {
      const response = await fetch(
        `/api/delete-policy?phone=${encodeURIComponent(identifier)}`,
      );
      const data: PolicyResponse = await response.json();

      if (data.account && Object.keys(data.account).length > 0) {
        setAccountInfo(data.account);
        setLookupStatus("found");
        // Pre-fill name if returned from API
        if (data.account.name) {
          setFullName(data.account.name);
        }
        // Use phone as identifier if returned
        if (data.account.phone) {
          setIdentifier(data.account.phone);
        }
      } else {
        setAccountInfo(null);
        setLookupStatus("not-found");
      }
    } catch {
      setAccountInfo(null);
      setLookupStatus("error");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirmed) return;

    const ref = makeReference();
    setReference(ref);

    // Try POST submission first
    setSubmitStatus("submitting");

    try {
      const response = await fetch("/api/submit-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: identifier,
          fullName,
          appType,
          notes,
          reference: ref,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus("success");
        setSubmitMessage(
          result.message || "Deletion request submitted successfully.",
        );
      } else if (result.fallback) {
        // API not available, use email fallback
        setSubmitStatus("idle");
        setSubmitMessage(
          "The online submission is temporarily unavailable. Please use the email button below to send your request.",
        );
      } else {
        setSubmitStatus("error");
        setSubmitMessage(
          result.message ||
            "Failed to submit. Please use the email button below.",
        );
      }
    } catch {
      setSubmitStatus("idle");
      setSubmitMessage(
        "The online submission is temporarily unavailable. Please use the email button below to send your request.",
      );
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <nav className="brand-bar" aria-label="SKG TRAVEL">
          <div className="brand-mark" aria-hidden="true">
            S
          </div>
          <span>SKG TRAVEL</span>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Account deletion request</p>
            <h1>Delete your SKG TRAVEL account</h1>
            <p>
              Use this page to request deletion for either the SKG TRAVEL User
              app or Driver app. Both apps follow the same deletion process.
            </p>
          </div>

          <div className="route-card" aria-label="Supported apps">
            <div className="route-line">
              <span>User App</span>
              <strong>Passenger account</strong>
            </div>
            <div className="route-divider" />
            <div className="route-line">
              <span>Driver App</span>
              <strong>Driver account</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="content-grid" aria-label="Deletion details">
        <form className="request-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <p className="eyebrow">Step 1</p>
            <h2>Send your deletion request</h2>
          </div>

          <fieldset className="segmented-control">
            <legend>Choose app</legend>
            <label className={appType === "user" ? "active" : ""}>
              <input
                checked={appType === "user"}
                name="appType"
                onChange={() => setAppType("user")}
                type="radio"
                value="user"
              />
              User App
            </label>
            <label className={appType === "driver" ? "active" : ""}>
              <input
                checked={appType === "driver"}
                name="appType"
                onChange={() => setAppType("driver")}
                type="radio"
                value="driver"
              />
              Driver App
            </label>
          </fieldset>

          {/* Phone / Email field with lookup button */}
          <div className="field-row">
            <label className="field">
              <span>Registered phone number or email</span>
              <input
                autoComplete="email"
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setLookupStatus("idle");
                  setAccountInfo(null);
                }}
                placeholder="Used in the SKG TRAVEL app"
                required
                type="text"
                value={identifier}
              />
            </label>
            <button
              className="lookup-btn"
              disabled={!identifier.trim() || lookupStatus === "loading"}
              onClick={handleLookup}
              type="button"
            >
              {lookupStatus === "loading" ? "Searching..." : "Find Account"}
            </button>
          </div>

          {/* Account lookup results */}
          {lookupStatus === "found" && accountInfo ? (
            <div className="account-info" role="status">
              <strong>Account found</strong>
              {accountInfo.name ? <span>Name: {accountInfo.name}</span> : null}
              {accountInfo.phone ? (
                <span>Phone: {accountInfo.phone}</span>
              ) : null}
              {accountInfo.email ? (
                <span>Email: {accountInfo.email}</span>
              ) : null}
              {accountInfo.appType ? (
                <span>App: {accountInfo.appType}</span>
              ) : null}
            </div>
          ) : lookupStatus === "not-found" ? (
            <div className="account-info warn" role="alert">
              <strong>Account not found</strong>
              <span>
                No account found with that phone or email. You can still proceed
                manually.
              </span>
            </div>
          ) : lookupStatus === "error" ? (
            <div className="account-info warn" role="alert">
              <strong>Lookup unavailable</strong>
              <span>
                Could not search for the account. Please fill in the details
                manually.
              </span>
            </div>
          ) : null}

          <label className="field">
            <span>Full name</span>
            <input
              autoComplete="name"
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your name"
              required
              type="text"
              value={fullName}
            />
          </label>

          <label className="field">
            <span>Additional details</span>
            <textarea
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Booking ID, vehicle number, or any note that helps us identify your account"
              rows={4}
              value={notes}
            />
          </label>

          <label className="check-row">
            <input
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              required
              type="checkbox"
            />
            <span>
              I request deletion of my account and associated personal data.
            </span>
          </label>

          <div className="actions">
            <button
              disabled={!confirmed || submitStatus === "submitting"}
              type="submit"
            >
              {submitStatus === "submitting"
                ? "Submitting..."
                : "Submit Deletion Request"}
            </button>
            <a href={mailToHref}>Email SKG TRAVEL</a>
          </div>

          {/* Submission result */}
          {submitStatus === "success" ? (
            <div className="success" role="status">
              <strong>Request submitted: {reference}</strong>
              <span>{submitMessage}</span>
            </div>
          ) : null}

          {submitStatus === "error" ||
          (reference && submitStatus === "idle") ? (
            <div className="success" role="status">
              <strong>Request ready: {reference}</strong>
              <span>
                {submitMessage ||
                  "Send the email using the button above so SKG TRAVEL can verify and delete the correct account."}
              </span>
            </div>
          ) : null}
        </form>

        <aside className="info-panel">
          <div className="panel-heading">
            <p className="eyebrow">Step 2</p>
            <h2>What will be deleted</h2>
          </div>

          <p>{policy}</p>

          <ul>
            <li>Profile details linked to your SKG TRAVEL account</li>
            <li>Login credentials and account access</li>
            <li>
              App data that is no longer needed for legal or safety reasons
            </li>
          </ul>

          <div className="retention-box">
            <strong>Data that may be kept</strong>
            <span>
              Trip, invoice, payment, safety, fraud-prevention, tax, and legal
              records may be retained only where required by applicable law.
            </span>
          </div>

          <p className="source-note">
            Policy source:{" "}
            {policySource === "api" ? "SKG TRAVEL API" : "standard fallback"}
          </p>
        </aside>
      </section>
    </main>
  );
}
