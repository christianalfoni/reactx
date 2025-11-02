export class FormState {
  name = "";
  email = "";
  message = "";

  constructor() {
    console.log("FormState created");
  }

  setName(value: string) {
    this.name = value;
  }

  setEmail(value: string) {
    this.email = value;
  }

  setMessage(value: string) {
    this.message = value;
  }

  reset() {
    this.name = "";
    this.email = "";
    this.message = "";
  }

  get isValid() {
    return this.name.trim() !== "" && this.email.includes("@");
  }

  dispose() {
    console.log("FormState disposed");
    // Cleanup logic here if needed
  }
}
