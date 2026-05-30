package main

import (
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	log.Println("api server started on :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Println(err)
	}
}
