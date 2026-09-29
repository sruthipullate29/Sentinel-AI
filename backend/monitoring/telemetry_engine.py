import psutil
import datetime
import threading
import time
from domain.models import TelemetrySnapshot, ResourceMetrics, ProcessMetrics

class TelemetryEngine:
    def __init__(self):
        self.running = False
        self.thread = None
        self.latest_snapshot = None

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()

    def _loop(self):
        while self.running:
            self.latest_snapshot = self._generate_snapshot()
            time.sleep(2)

    def _generate_snapshot(self) -> TelemetrySnapshot:
        cpu = psutil.cpu_percent(interval=None)
        ram = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/').percent
        
        system = ResourceMetrics(cpu=cpu, ram=ram, disk=disk)
        
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status']):
            try:
                processes.append(ProcessMetrics(
                    pid=proc.info['pid'],
                    name=proc.info['name'],
                    cpu=proc.info['cpu_percent'] or 0.0,
                    ram=proc.info['memory_percent'] or 0.0,
                    status=proc.info['status']
                ))
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
                
        # Keep top 10 processes
        processes = sorted(processes, key=lambda x: x.cpu, reverse=True)[:10]
        
        # Simple risk calculation
        risk_score = 0
        if cpu > 80:
            risk_score += 40
        elif cpu > 50:
            risk_score += 20
            
        if ram > 85:
            risk_score += 40
        elif ram > 60:
            risk_score += 20
            
        return TelemetrySnapshot(
            timestamp=datetime.datetime.utcnow().isoformat(),
            system=system,
            processes=processes,
            risk_score=min(100, risk_score),
            anomaly_signals=["High CPU Utilization"] if cpu > 80 else []
        )

    def get_latest_snapshot(self) -> TelemetrySnapshot:
        if not self.latest_snapshot:
            return self._generate_snapshot()
        return self.latest_snapshot

telemetry_engine = TelemetryEngine()
