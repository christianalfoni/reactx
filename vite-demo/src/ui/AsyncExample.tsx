import { Suspense, use } from "react";
import { TodoState } from "../state";

function UserProfile({ state }: { state: TodoState }) {
  if (state.asyncEaxmple.error) {
    return (
      <div style={{ color: "red" }}>
        Error: {state.asyncEaxmple.error.message}
      </div>
    );
  }

  if (state.asyncEaxmple.isPending) {
    return <div>Loading user data...</div>;
  }

  const userData = state.asyncEaxmple.value;

  return (
    <div
      style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}
    >
      <h3>User Profile</h3>
      <p>
        <strong>Name:</strong> {userData.name}
      </p>
      <p>
        <strong>Email:</strong> {userData.email}
      </p>
    </div>
  );
}

// Alternative: Using Suspense
function UserProfileWithSuspense({ state }: { state: TodoState }) {
  const userData = use(state.asyncEaxmple.promise);

  return (
    <div
      style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}
    >
      <h3>User Profile (with Suspense)</h3>
      <p>
        <strong>Name:</strong> {userData?.name}
      </p>
      <p>
        <strong>Email:</strong> {userData?.email}
      </p>
    </div>
  );
}

export function AsyncExample({ state }: { state: TodoState }) {
  return (
    <div style={{ padding: "2rem" }}>
      <h2>Async Primitive Example</h2>

      <div style={{ marginBottom: "2rem" }}>
        <h3>Without Suspense</h3>
        <UserProfile state={state} />
      </div>

      <div>
        <h3>With Suspense</h3>
        <Suspense fallback={<div>Loading with Suspense...</div>}>
          <UserProfileWithSuspense state={state} />
        </Suspense>
      </div>
    </div>
  );
}
