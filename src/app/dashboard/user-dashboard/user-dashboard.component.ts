import { Component, OnInit, AfterViewInit, ViewChild, ViewContainerRef, ElementRef, OnDestroy, createNgModuleRef, Injector } from '@angular/core';
import { UserService, User } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  users: User[] = [];
  displayedUsers: User[] = [];
  private usersSub: Subscription | undefined;
  
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartInstance: any;

  @ViewChild('modalContainer', { read: ViewContainerRef }) modalContainer!: ViewContainerRef;

  searchTerm: string = '';

  constructor(private userService: UserService, private injector: Injector) {}

  ngOnInit() {
    this.usersSub = this.userService.users$.subscribe(users => {
      this.users = users;
      this.applyCurrentFilter();
      this.updateChart();
    });
  }

  applyFilter(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyCurrentFilter();
  }

  applyCurrentFilter() {
    if (!this.searchTerm) {
      this.displayedUsers = [...this.users];
    } else {
      this.displayedUsers = this.users.filter(user => 
        user.name.toLowerCase().includes(this.searchTerm) || 
        user.email.toLowerCase().includes(this.searchTerm) ||
        user.role.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnDestroy() {
    if (this.usersSub) {
      this.usersSub.unsubscribe();
    }
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  async initChart() {
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);
    
    if (!this.chartCanvas) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chartInstance = new Chart(ctx, {
        type: 'pie',
        data: this.getChartData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { family: "'Inter', 'Roboto', sans-serif" }
              }
            }
          },
          animation: {
            animateScale: true,
            animateRotate: true
          }
        }
      });
    }
  }

  updateChart() {
    if (this.chartInstance) {
      this.chartInstance.data = this.getChartData();
      this.chartInstance.update();
    }
  }

  getChartData() {
    const roleCounts = { Admin: 0, Editor: 0, Viewer: 0 };
    this.users.forEach(user => {
      if (roleCounts[user.role as keyof typeof roleCounts] !== undefined) {
        roleCounts[user.role as keyof typeof roleCounts]++;
      }
    });

    return {
      labels: ['Admin', 'Editor', 'Viewer'],
      datasets: [{
        data: [roleCounts.Admin, roleCounts.Editor, roleCounts.Viewer],
        backgroundColor: ['#1c4980', '#4a90e2', '#aebfd4'],
        hoverBackgroundColor: ['#153863', '#357abd', '#8cabc9'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  }

  async openAddUserForm() {
    this.modalContainer.clear();
    
    const { UserFormModule } = await import('../../user-form/user-form.module');
    const moduleRef = createNgModuleRef(UserFormModule, this.injector);
    
    const { UserFormComponent } = await import('../../user-form/user-form.component');
    const componentRef = this.modalContainer.createComponent(UserFormComponent, { ngModuleRef: moduleRef });
    
    componentRef.instance.close.subscribe(() => {
      this.modalContainer.clear();
    });
  }
}
