import { useState } from "react";
import { reactive, ensure } from "reactx";
import { FormState } from "../state/FormState";

// Create an ensured factory for FormState
const ensureForm = ensure(() => new FormState());

function Form() {
  // When this component mounts, it will get the ensured form instance
  // If the component unmounts and remounts, it will get the same instance
  const form = reactive(ensureForm());

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "1rem" }}>
      <h3>Contact Form (Ensured State)</h3>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Name:
          <input
            type="text"
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.25rem" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Email:
          <input
            type="email"
            value={form.email}
            onChange={(e) => form.setEmail(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.25rem" }}
          />
        </label>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Message:
          <textarea
            value={form.message}
            onChange={(e) => form.setMessage(e.target.value)}
            style={{ marginLeft: "0.5rem", padding: "0.25rem", display: "block" }}
            rows={3}
          />
        </label>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => form.reset()}
          style={{ padding: "0.5rem 1rem" }}
        >
          Reset
        </button>
        <button
          onClick={() => alert("Form submitted!")}
          disabled={!form.isValid}
          style={{
            padding: "0.5rem 1rem",
            marginLeft: "0.5rem",
            opacity: form.isValid ? 1 : 0.5
          }}
        >
          Submit
        </button>
      </div>

      <div style={{ fontSize: "0.9em", color: "#666" }}>
        <p>Status: {form.isValid ? "✓ Valid" : "✗ Invalid"}</p>
        <p style={{ fontSize: "0.8em", marginTop: "0.5rem" }}>
          <strong>Note:</strong> The form state is ensured. When you toggle the form off and on,
          the same instance is reused, so your data persists!
        </p>
      </div>
    </div>
  );
}

export function EnsureExample() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <h2>Ensure Example</h2>
      <p>
        This example demonstrates <code>ensure()</code>, which creates a singleton instance
        that persists across component mounts/unmounts. The form state stays alive even when
        the component is unmounted and remounted.
      </p>

      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          padding: "0.5rem 1rem",
          marginTop: "1rem",
          backgroundColor: showForm ? "#dc3545" : "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        {showForm ? "Hide Form" : "Show Form"}
      </button>

      {showForm && <Form />}

      <div style={{ marginTop: "1rem", fontSize: "0.9em", color: "#666" }}>
        <p><strong>Try this:</strong></p>
        <ol>
          <li>Click "Show Form" and fill in some fields</li>
          <li>Click "Hide Form" to unmount the component</li>
          <li>Click "Show Form" again - your data is still there!</li>
          <li>Check the console to see when FormState is created</li>
        </ol>
      </div>
    </div>
  );
}
