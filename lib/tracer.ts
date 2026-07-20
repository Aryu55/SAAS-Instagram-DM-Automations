export class ActionTracer {
  private traces: string[] = [];

  log(message: string, ...args: any[]) {
    const formattedArgs = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" ");
    const formatted = `⚙️ [SERVER BACKEND] ${message} ${formattedArgs}`.trim();
    console.log(formatted);
    this.traces.push(formatted);
  }

  error(message: string, ...args: any[]) {
    const formattedArgs = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" ");
    const formatted = `❌ [SERVER BACKEND ERROR] ${message} ${formattedArgs}`.trim();
    console.error(formatted);
    this.traces.push(formatted);
  }

  warn(message: string, ...args: any[]) {
    const formattedArgs = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" ");
    const formatted = `⚠️ [SERVER BACKEND WARNING] ${message} ${formattedArgs}`.trim();
    console.warn(formatted);
    this.traces.push(formatted);
  }

  getTraces() {
    return this.traces;
  }
}
