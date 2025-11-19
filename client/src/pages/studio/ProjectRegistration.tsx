import ProjectCreate from "@/pages/ProjectCreate";
import StudioLayout from "./StudioLayout";

// Studio registration page: show a large centered hero and then the create form.
export default function ProjectRegistration() {
  return (
    <StudioLayout>
      <div className="flex flex-col items-center justify-center py-16 px-6 scale-in">
        <div className="float mb-8">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight gradient-text mb-6 text-center">NEXURA STUDIO</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl text-center mb-4 leading-relaxed">Create and manage your project activations with powerful tools and seamless integration.</p>
        <p className="text-lg text-purple-400 max-w-2xl text-center mb-12">Connect your wallet to unlock the full potential of Web3 development.</p>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mb-12">
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">L</div>
            <h3 className="font-bold text-lg mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">Deploy in minutes, not hours</p>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">S</div>
            <h3 className="font-bold text-lg mb-2">Secure & Reliable</h3>
            <p className="text-sm text-muted-foreground">Enterprise-grade security</p>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-white font-bold text-xl">R</div>
            <h3 className="font-bold text-lg mb-2">Scale Effortlessly</h3>
            <p className="text-sm text-muted-foreground">Grow without limits</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 mb-16">
        <ProjectCreate />
      </div>
    </StudioLayout>
  );
}
