class PageManager{
    pagination=0;
    paginationLimit;
    lastUrlVisited=false;
    setLastUrlVisited(lastUrlVisited){
        if(lastUrlVisited != false){
            this.lastUrlVisited = lastUrlVisited;
        }
    }
    setPagination(pagination){
        if(pagination != false){
            this.pagination = pagination;
        }
    }
}