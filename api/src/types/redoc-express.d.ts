declare module 'redoc-express' {
  interface RedocOptions {
    title?: string;
    specUrl: string;
    redocOptions?: Record<string, any>;
  }
  
  function redoc(options: RedocOptions): any;
  
  export = redoc;
} 
