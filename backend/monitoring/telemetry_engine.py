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
        cpu = round(psutil.cpu_percent(interval=None), 1)
        ram = round(psutil.virtual_memory().percent, 1)
        try:
            disk = round(psutil.disk_usage('C:').percent, 1)
        except Exception:
            disk = round(psutil.disk_usage('/').percent, 1)
        
        system = ResourceMetrics(cpu=cpu, ram=ram, disk=disk)
        
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'status']):
            try:
                name = proc.info['name']
                if not name or name == 'System Idle Process':
                    continue
                mem_mb = round(proc.memory_info().rss / (1024 * 1024), 1)
                cpu_p = round(proc.cpu_percent(interval=None) or 0.0, 1)
                processes.append(ProcessMetrics(
                    pid=proc.info['pid'],
                    name=name,
                    cpu=cpu_p,
                    ram=mem_mb,
                    status=proc.info.get('status') or 'running'
                ))
            except (psutil.NoSuchProcess, psutil.AccessDenied, Exception):
                pass
                
        # Sort by resident memory (RAM) descending, then take top 10 real active processes
        processes = sorted(processes, key=lambda x: (x.cpu, x.ram), reverse=True)[:10]
        
        # Risk calculation based on real system load
        risk_score = 12
        if cpu > 80:
            risk_score += 45
        elif cpu > 50:
            risk_score += 25
            
        if ram > 85:
            risk_score += 40
        elif ram > 65:
            risk_score += 20
            
        return TelemetrySnapshot(
            timestamp=datetime.datetime.utcnow().isoformat(),
            system=system,
            processes=processes,
            risk_score=min(100, risk_score),
            anomaly_signals=["High Host Memory Utilization"] if ram > 85 else []
        )

    def get_latest_snapshot(self) -> TelemetrySnapshot:
        if not self.latest_snapshot:
            return self._generate_snapshot()
        return self.latest_snapshot

telemetry_engine = TelemetryEngine()
