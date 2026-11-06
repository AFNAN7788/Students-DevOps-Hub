import { Link } from "react-router-dom";
import {
  Cpu,
  GitBranch,
  CheckCircle,
  ArrowRight,
  Github,
  Terminal,
  Shield,
  BarChart3,
  ChevronRight,
  Star,
  Globe,
  Layers,
} from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import Card, { CardBody } from "../components/ui/Card.jsx";

const features = [
  {
    icon: GitBranch,
    title: "GitHub Integration",
    description: "Connect your repositories in seconds. Automatic webhook setup for push events, PRs, and releases.",
  },
  {
    icon: Terminal,
    title: "Pipeline Monitoring",
    description: "Real-time CI/CD pipeline status with logs, duration tracking, and failure diagnostics.",
  },
  {
    icon: CheckCircle,
    title: "Test Reports",
    description: "Aggregate unit, integration, and e2e test results. Track coverage trends and flaky tests.",
  },
  {
    icon: Layers,
    title: "Deployment Tracking",
    description: "Monitor deployments across environments. Rollback history and health checks included.",
  },
  {
    icon: Shield,
    title: "Security Scanning",
    description: "Integrated SAST/DAST results. Dependency vulnerability alerts and license compliance.",
  },
  {
    icon: BarChart3,
    title: "Team Analytics",
    description: "DORA metrics, deployment frequency, lead time, MTTR, and change failure rate dashboards.",
  },
];

const workflowSteps = [
  { number: "01", title: "Connect", description: "Link your GitHub account and select repositories to monitor." },
  { number: "02", title: "Configure", description: "Define pipeline triggers, environments, and notification preferences." },
  { number: "03", title: "Build", description: "Push code — we automatically track CI/CD runs, tests, and deployments." },
  { number: "04", title: "Observe", description: "View real-time dashboards, receive alerts, and optimize your delivery process." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-50 text-slate-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[150px] animate-gradient" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[150px] animate-gradient" style={{ animationDelay: "1.5s" }} />

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-8 animate-fade-in">
            <Star className="w-4 h-4" />
            <span>Student DevOps Hub v1.0 — Built for student developers</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 animate-slide-up">
            One dashboard for every
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              student project
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Register projects, connect GitHub repositories, and monitor CI/CD builds, automated tests,
            deployments, and application health — all from a single, beautiful interface.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/signup">
                Get started free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-slate-500 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            No credit card required · Free for students · Open source first
          </p>
        </div>
      </section>

      {/* Trust indicators — integration targets are PLANNED, not live yet (labeled on screen) */}
      <section className="border-y border-navy-200/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
            <span className="flex items-center gap-2"><Github className="w-4 h-4" aria-hidden="true" /> GitHub Actions</span>
            <span className="flex items-center gap-2"><Terminal className="w-4 h-4" aria-hidden="true" /> GitLab CI</span>
            <span className="flex items-center gap-2"><Globe className="w-4 h-4" aria-hidden="true" /> Vercel / Netlify</span>
            <span className="flex items-center gap-2"><Layers className="w-4 h-4" aria-hidden="true" /> Docker</span>
            <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" aria-hidden="true" /> Prometheus / Grafana</span>
          </div>
          <p className="text-center text-xs text-slate-600 mt-4">
            Illustrative roadmap: these integrations are planned for the platform and not yet connected.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to ship confidently</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A unified platform designed for student developers to learn and practice real-world DevOps workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="group animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <CardBody className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 mb-4 group-hover:bg-primary-500/20 group-hover:text-primary-300 transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="how-it-works" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-navy-100/30 border-y border-navy-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Get from zero to monitoring in four simple steps. No complex setup required.
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:absolute left-1/2 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary-500/30 via-transparent to-primary-500/30 -translate-x-1/2" />

            <div className="space-y-12">
              {workflowSteps.map((step, i) => (
                <div key={i} className="relative flex gap-6 md:gap-8 animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary-500/30 z-10">
                    {step.number}
                  </div>
                  <div className="flex-1 pt-4 md:pt-0">
                    <div className="p-6 rounded-2xl bg-navy-100/50 border border-navy-200/50 hover:border-primary-500/30 transition-colors">
                      <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                      <p className="text-slate-400">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative p-8 md:p-12 lg:p-16 rounded-3xl bg-gradient-to-br from-navy-100/50 to-navy-200/50 border border-navy-200 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to level up your DevOps game?
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of student developers building better software delivery pipelines.
                Start monitoring your first project in minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/signup">Create your free account</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#how-it-works" className="inline-flex items-center">
                    See how it works
                    <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-200/50 py-12 px-4 sm:px-6 lg:px-8 bg-navy-100/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg shadow-lg shadow-primary-500/20">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight text-white">
                  Student<span className="text-primary-400">DevOps</span> Hub
                </span>
              </div>
              <p className="text-sm text-slate-400">
                A learning platform for students to practice real-world DevOps workflows.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/dashboard" className="hover:text-primary-400 transition-colors">Dashboard</Link></li>
                <li><Link to="/projects" className="hover:text-primary-400 transition-colors">Projects</Link></li>
                <li><Link to="/settings" className="hover:text-primary-400 transition-colors">Settings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Integrations</h4>
              <p className="text-sm text-slate-500">
                GitHub Actions, Docker, and Grafana connectors are planned — no external links yet.
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-navy-200/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© 2026 Student DevOps Hub. Built for students, by students.</p>
            <p className="text-xs">Illustrative branding — social links will appear when the project goes public.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}