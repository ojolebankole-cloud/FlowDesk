import React from 'react';

interface State { hasError: boolean }
export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('FlowDesk UI error', error, info); }
  render() {
    if (this.state.hasError) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}><section style={{maxWidth:440,textAlign:'center'}}><h1>Something went wrong</h1><p>FlowDesk could not render this screen. Your saved browser data has not been cleared.</p><button onClick={()=>this.setState({hasError:false})}>Try again</button></section></main>;
    return this.props.children;
  }
}
