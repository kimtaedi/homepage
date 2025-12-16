// calendar.js
import { APPS_SCRIPT_URL } from './utils.js';

class Calendar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.selectedDate = null;
        this.postsData = {}; // {날짜: 게시물개수}
        
        this.init();
    }

    async init() {
        await this.loadPostsData();
        this.render();
    }

    // 스프레드시트에서 게시물 데이터 가져오기
    async loadPostsData() {
        try {
            const response = await fetch(`${APPS_SCRIPT_URL}?action=getPosts`);
            const data = await response.json();
            
            // 날짜별로 게시물 개수 집계
            this.postsData = {};
            if (data.posts && Array.isArray(data.posts)) {
                data.posts.forEach(post => {
                    // 게시물의 날짜 필드 (스프레드시트 구조에 따라 조정 필요)
                    const dateStr = post.date || post.timestamp;
                    if (dateStr) {
                        const date = new Date(dateStr);
                        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                        this.postsData[key] = (this.postsData[key] || 0) + 1;
                    }
                });
            }
        } catch (error) {
            console.error('게시물 데이터 로드 실패:', error);
        }
    }

    // 캘린더 렌더링
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        this.container.innerHTML = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="prev-month">◀</button>
                    <div class="current-month">${year}년 ${month + 1}월</div>
                    <button class="next-month">▶</button>
                </div>
                <div class="calendar-weekdays">
                    <div>일</div>
                    <div>월</div>
                    <div>화</div>
                    <div>수</div>
                    <div>목</div>
                    <div>금</div>
                    <div>토</div>
                </div>
                <div class="calendar-days">
                    ${this.generateDays(year, month)}
                </div>
            </div>
        `;

        this.attachEvents();
    }

    // 날짜 칸들 생성
    generateDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        
        const firstDayWeek = firstDay.getDay();
        const lastDate = lastDay.getDate();
        const prevLastDate = prevLastDay.getDate();
        
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        let html = '';
        
        // 이전 달 날짜들
        for (let i = firstDayWeek - 1; i >= 0; i--) {
            const day = prevLastDate - i;
            html += `<div class="calendar-day other-month">${day}</div>`;
        }
        
        // 현재 달 날짜들
        for (let day = 1; day <= lastDate; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const postCount = this.postsData[dateStr] || 0;
            
            let classes = ['calendar-day'];
            if (dateStr === todayStr) classes.push('today');
            if (postCount > 0) classes.push('has-post');
            
            html += `<div class="${classes.join(' ')}" data-date="${dateStr}" data-count="${postCount}">${day}</div>`;
        }
        
        // 다음 달 날짜들로 채우기
        const totalCells = Math.ceil((firstDayWeek + lastDate) / 7) * 7;
        const remainingCells = totalCells - (firstDayWeek + lastDate);
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month">${day}</div>`;
        }
        
        return html;
    }

    // 이벤트 리스너 연결
    attachEvents() {
        // 월 이동 버튼
        this.container.querySelector('.prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        this.container.querySelector('.next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });

        // 날짜 클릭
        this.container.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const date = e.target.dataset.date;
                if (date) {
                    this.onDateClick(date);
                }
            });
        });
    }

    // 날짜 클릭 시 동작 (필요시 커스터마이즈)
    onDateClick(dateStr) {
        console.log('선택된 날짜:', dateStr);
        this.selectedDate = dateStr;
        
        // 선택 표시
        this.container.querySelectorAll('.calendar-day').forEach(el => {
            el.classList.remove('selected');
        });
        this.container.querySelector(`[data-date="${dateStr}"]`)?.classList.add('selected');
        
        // 해당 날짜의 게시물 보여주기 (이벤트 발생)
        const event = new CustomEvent('dateSelected', { 
            detail: { 
                date: dateStr, 
                postCount: this.postsData[dateStr] || 0 
            } 
        });
        document.dispatchEvent(event);
    }
}

// 내보내기
export default Calendar;
