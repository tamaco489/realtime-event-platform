package main

import (
	"fmt"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	fmt.Println("api server started on :8080")
	http.ListenAndServe(":8080", mux)
}
